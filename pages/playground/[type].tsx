import Editor from "@monaco-editor/react";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { AiFillCloseCircle } from "react-icons/ai";
import { Terminal } from "xterm";
import FileSystemComponent from "../../components/FileSystemComponent";
import { FileStructure } from "../../utils/DataStructure";
import { sendRequestToRceServer } from "../../utils/sendRequests";

function Playground() {
	const router = useRouter();
	const { type } = router.query;
	const [containerId, setContainerId] = useState();
	const [filetoCode, setFileToCode] = useState<Record<string, string>>({});
	const [terminal, setTerminal] = useState<Terminal>();
	const [fileSystemString, setFileSystemString] = useState();
	const [activeFileName, setActiveFileName] = useState("./script.py");
	const [codeOutput, setCodeOutput] = useState("");
	const [openedFiles, setOpenedFiles] = useState<string[]>([]);
	const [terminalCommand, setTerminalCommand] = useState("");
	const [sendTerminalCommand, setSendTerminalCommand] = useState(false);
	const [terminalOutput, setTerminalOutput] = useState<string>();
	const [key, setKey] = useState(0);

	useEffect(() => {
		if (containerId !== undefined) return;
		sendRequestToRceServer("POST", {
			language: type as string,
		}).then((val) => {
			val?.json().then((body) => {
				setContainerId(body.containerId);
				setFileSystemString(body.files);
			});
		});
	}, []);

	useEffect(() => {
		setFileToCode((prev) => {
			if (Object.hasOwn(prev, activeFileName)) return prev;
			return { ...prev, [activeFileName]: "" };
		});
		setOpenedFiles((prev) => {
			if (prev.includes(activeFileName)) return prev;
			return [...prev, activeFileName];
		});
	}, [activeFileName]);

	const FileSystemJsx = useMemo(() => {
		if (!fileSystemString) return;
		const fileStruct = FileStructure.fromString(fileSystemString);
		setKey((prev) => prev + 1);
		return (
			<FileSystemComponent
				fileRoot={fileStruct}
				id={key}
				{...{ setActiveFileName }}
			/>
		);
	}, [fileSystemString]);

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
		term.onKey((key) => {
			term.clear();

			if (key.key === "\u007f") {
				setTerminalCommand((prev) => prev.slice(0, prev.length - 1));
				return;
			}
			if (key.key === "\r") {
				setSendTerminalCommand(true);
				return;
			}
			setTerminalCommand((prev) => prev + key.key);
		});
		setTerminal(term);
	}, []);

	useEffect(() => {
		if (sendTerminalCommand) {
			sendRequestToRceServer("POST", {
				language: "shell",
				containerId,
				code: terminalCommand,
				fileName: "",
			})
				.then((val) => {
					val?.json().then((body) => {
						setTerminalOutput(body.output);
						setSendTerminalCommand(false);
						setTerminalCommand("");
					});
				})
				.then(() => {
					sendRequestToRceServer("POST", {
						language: "shell",
						containerId,
						code: "ls -R",
						fileName: "",
					}).then((val) => {
						val?.json().then((body) => {
							setFileSystemString(body.output);
						});
					});
				});
		}
	}, [sendTerminalCommand]);

	useEffect(() => {
		terminal?.writeln(terminalCommand);
	}, [terminalCommand]);

	useEffect(() => {
		terminal?.writeln(terminalOutput || "");
	}, [terminalOutput]);

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
		setCodeOutput(output);
	};

	return (
		<div className="grid grid-cols-10 h-screen">
			<div className="col-span-2 bg-black border-r-2 border-white">
				<div className="w-full">{FileSystemJsx}</div>
			</div>
			<div className="col-span-5 h-full flex flex-col">
				<div className="flex w-full bg-stone-700">
					{openedFiles.map((val) => (
						<div
							className={`flex items-center p-1
						${activeFileName === val ? "bg-amber-400" : ""}
						`}
						>
							<button
								key={val}
								disabled={activeFileName === val}
								onClick={() => {
									setActiveFileName(val);
								}}
								className={`px-2`}
							>
								{val.split("/").pop()}
							</button>
							<button
								onClick={() =>
									setOpenedFiles((prev) =>
										prev.filter((f) => f !== val)
									)
								}
							>
								<AiFillCloseCircle />
							</button>
						</div>
					))}
					<button
						onClick={() => onRunCode(terminal)}
						className="mx-2 p-1"
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
			<div className="col-span-3 bg-black border-l-2 border-white text-white p-2">
				{codeOutput}
			</div>
		</div>
	);
}

export default Playground;
