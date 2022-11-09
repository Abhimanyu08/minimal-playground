import Editor from "@monaco-editor/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { sendRequestToRceServer } from "../../utils/sendRequests";
import WebSocket from "ws";

function Playground() {
	const router = useRouter();
	const { type } = router.query;
	const [containerId, setContainerId] = useState("");
	const [filetoCode, setFileToCode] = useState<Record<string, string>>({
		script: "print('Hello world')",
		file: "print('different file')",
	});
	const [activeFileName, setActiveFileName] = useState("script");

	useEffect(() => {
		if (containerId) return;
		sendRequestToRceServer("POST", { language: type as string }).then(
			(val) => {
				console.log(val);
				val?.json().then((body) => {
					setContainerId(body.containerId);
				});
			}
		);
	}, []);

	useEffect(() => {
		if (!containerId) return;
		const socket = new WebSocket(
			`wss://127.0.0.1:2375/containers/${containerId}/attach/ws`
		);

		socket.addEventListener("message", ({ data }) => {
			console.log(data);
		});
	}, [containerId]);

	const onRunCode = async () => {
		sendRequestToRceServer("POST", {
			language: type as string,
			code: filetoCode[activeFileName],
			containerId,
			fileName: activeFileName,
		});
	};

	return (
		<div className="w-fit h-fit p-4 border-2 border-black m-2">
			<div className="flex w-full">
				{Object.keys(filetoCode).map((val) => (
					<button
						key={val}
						disabled={activeFileName === val}
						onClick={() => {
							setActiveFileName(val);
						}}
						className={` px-2 ${
							activeFileName === val
								? "shadow-gray-700 shadow-inner"
								: ""
						}`}
					>
						{val}
					</button>
				))}
				<button onClick={onRunCode}>Run</button>
			</div>
			<Editor
				language="python"
				defaultValue={filetoCode[activeFileName]}
				height={200}
				width={800}
				theme="vs-dark"
				path={activeFileName}
				onMount={(editor) =>
					setFileToCode((prev) => ({
						...prev,
						[activeFileName]: editor.getValue(),
					}))
				}
				onChange={(value) =>
					setFileToCode((prev) => ({
						...prev,
						[activeFileName]: value || "",
					}))
				}
			/>
		</div>
	);
}

export default Playground;
