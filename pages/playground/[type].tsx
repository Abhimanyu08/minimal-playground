import Editor from "@monaco-editor/react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { sendRequestToRceServer } from "../../utils/sendRequests";
import { Terminal } from "xterm";
import { AttachAddon } from "xterm-addon-attach";
import "../../node_modules/xterm/lib/xterm.js";

function Playground() {
	const router = useRouter();
	const { type } = router.query;
	const [containerId, setContainerId] = useState();
	const [filetoCode, setFileToCode] = useState<Record<string, string>>({
		script: "print('Hello world')",
		file: "print('different file')",
	});
	const [activeFileName, setActiveFileName] = useState("script");
	const [socket, setSocket] = useState<WebSocket>();
	const [connected, setConnected] = useState(false);

	useEffect(() => {
		if (containerId !== undefined) return;
		sendRequestToRceServer("POST", { language: type as string }).then(
			(val) => {
				val?.json().then((body) => {
					setContainerId(body.containerId);
				});
			}
		);
	}, []);

	useEffect(() => {
		if (connected || !containerId) return;

		const socket = new WebSocket(
			`ws://127.0.0.1:2375/containers/${containerId}/attach/ws?stream=1&stdout=1&stdin=0&logs=1`
		);

		socket.addEventListener("message", (ev) => {
			console.log(ev);
			setConnected(true);
		});
		socket.addEventListener("open", (ev) => {
			console.log("opened ev ->", ev);
			socket.send("ls -l\n");
		});
		socket.addEventListener("close", (ev) => {
			console.log("closing", ev);
		});
		socket.addEventListener("error", (ev) => {
			console.log(ev);
			setConnected(false);
		});

		setSocket(socket);
		window.onbeforeunload = () => {
			socket.close();
		};
		return () => {
			socket.close();
		};
	}, [connected, containerId]);

	useEffect(() => {
		if (!socket) return;

		const term = new Terminal();
		const attachAddon = new AttachAddon(socket);
		const terminalElem = document.getElementById("terminal");
		terminalElem?.replaceChildren("");
		if (terminalElem) term.open(terminalElem);

		term.loadAddon(attachAddon);
		term.onKey(({ key }) => term.write(key));
	}, [socket]);

	const onRunCode = async () => {
		sendRequestToRceServer("POST", {
			language: type as string,
			code: filetoCode[activeFileName],
			containerId,
			fileName: activeFileName,
		});
	};
	const onSendSocketMessage = (socket: WebSocket) => {
		console.log("this happened");
		socket.CLOSED;
		socket?.send("ls -l");
	};

	return (
		<>
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
					<button onClick={onRunCode} className="mx-2">
						Run
					</button>
					<button
						onClick={() => {
							if (socket) onSendSocketMessage(socket);
						}}
					>
						Send
					</button>
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
				<div className="" id="terminal"></div>
			</div>
		</>
	);
}

export default Playground;
