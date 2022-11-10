import Editor from "@monaco-editor/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { Terminal } from "xterm";
import "../../node_modules/xterm/lib/xterm.js";
import { sendRequestToRceServer } from "../../utils/sendRequests";
import { FileStructure } from "../../utils/DataStructure";

function Playground() {
	const router = useRouter();
	const { type } = router.query;
	const [containerId, setContainerId] = useState();
	const [filetoCode, setFileToCode] = useState<Record<string, string>>({
		script: "print('Hello world')",
		file: "print('different file')",
	});
	const [activeFileName, setActiveFileName] = useState("script");
	const [terminal, setTerminal] = useState<Terminal>();
	const [fileSystemString, setFileSystemString] = useState(
		".:\r\nnew src\r\n\r\n./new:\r\nmain.py\r\n\r\n./src:\r\nfile.py\tfiles\tfolder\tother.py\r\n\r\n./src/files:\r\nfile1.py\r\n\r\n./src/folder:\r\nhello.py\r\n"
	);

	useEffect(() => {
		if (containerId !== undefined) return;
		const createContainerResp = sendRequestToRceServer("POST", {
			language: type as string,
		}).then((val) => {
			val?.json().then((body) => {
				setContainerId(body.containerId);
				// setFileSystemString(body.files);
			});
		});
	}, []);

	useEffect(() => {
		const term = new Terminal({
			disableStdin: false,
			tabStopWidth: 4,
			cursorBlink: true,
			rows: 10,
			cols: 100,
		});
		const terminalElem = document.getElementById("terminal");
		terminalElem?.replaceChildren("");
		if (terminalElem) term.open(terminalElem);

		setTerminal(term);
	}, []);

	const onRunCode = async (terminal: Terminal | undefined) => {
		if (!terminal) return;
		const resp = await sendRequestToRceServer("POST", {
			language: type as string,
			code: filetoCode[activeFileName],
			containerId,
			fileName: activeFileName,
		});

		const output = (await resp?.json()).output;
		console.log(output);
		terminal?.write(`$  ${output}`, () => console.log("written"));
	};

	return (
		<div className="grid grid-cols-7 h-screen">
			<div className="col-span-2">
				{FileStructure.fromString(fileSystemString).toJsx()}
			</div>

			<div className="col-span-5 h-full flex flex-col">
				<div className="flex w-full bg-stone-700">
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
					<button
						onClick={() => onRunCode(terminal)}
						className="mx-2"
					>
						Run
					</button>
				</div>
				<Editor
					language={type as string}
					defaultValue={filetoCode[activeFileName]}
					className="w-full h-full grow"
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
				<div className="mt-4" id="terminal"></div>
			</div>
		</div>
	);
}

export default Playground;
