import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AiFillCloseCircle } from "react-icons/ai";
import { Terminal } from "xterm";
import FileSystemComponent from "../../components/FileSystemComponent";
import { extensionToLanguage } from "../../utils/constants";
import { FileStructure } from "../../utils/DataStructure";
import { sendRequestToRceServer } from "../../utils/sendRequests";

function Playground() {
	const router = useRouter();
	const { type } = router.query;
	const [containerId, setContainerId] = useState();
	const [terminal, setTerminal] = useState<Terminal>();
	const [fileSystemString, setFileSystemString] = useState();
	const [activeFileName, setActiveFileName] = useState("");
	const [codeOutput, setCodeOutput] = useState("");
	const [currentlyOpenedFiles, setCurrentlyOpenedFiles] = useState<string[]>(
		[]
	);
	const [openedFiles, setOpenedFiles] = useState<string[]>([]);
	const [terminalCommand, setTerminalCommand] = useState("");
	const [sendTerminalCommand, setSendTerminalCommand] = useState(false);
	const [terminalOutput, setTerminalOutput] = useState<string>();
	const [editor, setEditor] = useState<editor.IStandaloneCodeEditor>();
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
		if (activeFileName && !openedFiles.includes(activeFileName)) {
			sendRequestToRceServer("POST", {
				language: "shell",
				containerId,
				fileName: "",
				code: `cat ${activeFileName}`,
			}).then((val) => {
				val?.json().then((body) => {
					editor?.setValue(body.output as string);
				});
			});
		}

		setOpenedFiles((prev) => {
			if (prev.includes(activeFileName)) return prev;
			return [...prev, activeFileName];
		});
		setCurrentlyOpenedFiles((prev) => {
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
			code: editor?.getValue(),
			containerId,
			fileName: activeFileName,
		});

		const output = (await resp?.json()).output;
		console.log(output);
		setCodeOutput(output);
	};

	return (
		<div
			className="flex w-screen h-screen
		"
		>
			<div className="w-2/12 bg-stone-800 border-r-2 border-white">
				<div className="w-full">{FileSystemJsx}</div>
			</div>
			<div className="w-8/12 h-full flex flex-col">
				<div className="flex w-full bg-stone-700">
					{currentlyOpenedFiles.map((val) => {
						if (!val) return <></>;
						return (
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
										setCurrentlyOpenedFiles((prev) =>
											prev.filter((f) => f !== val)
										)
									}
								>
									<AiFillCloseCircle />
								</button>
							</div>
						);
					})}
					<button
						onClick={() => onRunCode(terminal)}
						className="bg-green-500 p-1 ml-auto"
					>
						Run
					</button>
				</div>
				<Editor
					language={
						extensionToLanguage[activeFileName.split(".").pop()!]
					}
					className="w-full grow"
					theme="vs-dark"
					path={activeFileName}
					onMount={(editor) => setEditor(editor)}
				/>
				<div className="flex w-full bg-stone-700 p-2">Terminal</div>
				<div className="" id="terminal"></div>
			</div>
			<div className="w-2/12  bg-black border-l-2 border-white text-white">
				<div className="bg-stone-700 p-1 w-full text-black px-28">
					Console
				</div>
				<span>{codeOutput}</span>
			</div>
		</div>
	);
}

export default Playground;
