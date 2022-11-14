import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { AiFillCloseCircle } from "react-icons/ai";
// import { Terminal } from "xterm";
import FileSystemComponent from "../../components/FileSystemComponent";
import { extensionToLanguage } from "../../utils/constants";
import { FileStructure } from "../../utils/DataStructure";
import getContainerInfo from "../../utils/getContainerInfo";
import { sendRequestToRceServer } from "../../utils/sendRequests";

function Playground() {
	const router = useRouter();
	const { type } = router.query;
	const [containerId, setContainerId] = useState<string>();
	const [terminal, setTerminal] = useState<any>();
	const [fileSystemString, setFileSystemString] = useState();
	const [activeFileName, setActiveFileName] = useState("");
	const [codeOutput, setCodeOutput] = useState("");
	const [currentlyOpenedFiles, setCurrentlyOpenedFiles] = useState<string[]>(
		[]
	);
	const [fileToSaved, setFileToSaved] = useState<Record<string, boolean>>({});
	const [openedFiles, setOpenedFiles] = useState<string[]>([]);
	const [terminalCommand, setTerminalCommand] = useState("");
	const [sendTerminalCommand, setSendTerminalCommand] = useState(false);
	const [terminalOutput, setTerminalOutput] = useState<string>();
	const [editor, setEditor] = useState<editor.IStandaloneCodeEditor>();
	const [key, setKey] = useState(0);

	useEffect(() => {
		if (containerId !== undefined) return;
		if (localStorage.getItem("playground-container")) {
			const info = getContainerInfo(
				localStorage.getItem("playground-container") as string
			);
			if (info.language === type) {
				setContainerId(info.containerId);
				sendRequestToRceServer("POST", {
					language: "shell",
					containerId: info.containerId,
					code: "ls -R",
					fileName: "",
				}).then((val) => {
					val?.json().then((body) => {
						setFileSystemString(body.output);
					});
				});
				return;
			}
		}

		if (type) {
			sendRequestToRceServer("POST", {
				language: type as string,
			}).then((val) => {
				val?.json().then((body) => {
					setContainerId(body.containerId);
					localStorage.setItem(
						"playground-container",
						`language-${type};containerId-${body.containerId}`
					);
					setFileSystemString(body.files);
				});
			});
		}
	}, [type]);

	useEffect(() => {
		if (!editor) return;
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
		if (!Object.hasOwn(fileToSaved, activeFileName)) {
			setFileToSaved((prev) => ({ ...prev, [activeFileName]: false }));
		}

		setOpenedFiles((prev) => {
			if (prev.includes(activeFileName)) return prev;
			return [...prev, activeFileName];
		});
		setCurrentlyOpenedFiles((prev) => {
			if (prev.includes(activeFileName)) return prev;
			return [...prev, activeFileName];
		});
	}, [activeFileName, editor]);

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
		const initTerminal = async () => {
			const { Terminal } = await import("xterm");
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
				// term.clear();
				if (key.key === "\u007f") {
					term.write("\b \b");
					// term.clear();

					setTerminalCommand((prev) =>
						prev.slice(0, prev.length - 1)
					);
					return;
				}
				if (key.key === "\r") {
					setSendTerminalCommand(true);
					return;
				}
				setTerminalCommand((prev) => prev + key.key);
				term.write(key.key);
			});
			setTerminal(term);
		};
		initTerminal();
	}, []);

	useEffect(() => {
		if (sendTerminalCommand) {
			if (terminalCommand === "clear") {
				terminal.clear();
				setTerminalCommand("");
				setSendTerminalCommand(false);
				return;
			}
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
		terminal?.write("\r\n" + terminalOutput + "\r\n" || "");
	}, [terminalOutput]);

	const onRunCode = async (terminal: any) => {
		if (!terminal) return;
		const resp = await sendRequestToRceServer("POST", {
			language: type as string,
			code: editor?.getValue(),
			containerId,
			fileName: activeFileName,
		});

		const output = (await resp?.json()).output;
		setFileToSaved((prev) => ({ ...prev, [activeFileName]: true }));
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
								key={val}
								className={`flex items-center p-1
								${fileToSaved[val] ? "" : "underline"}
						${activeFileName === val ? "bg-amber-500" : ""}
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
									onClick={() => {
										setCurrentlyOpenedFiles((prev) =>
											prev.filter((f) => f !== val)
										);
										if (activeFileName === val) {
											setActiveFileName("");
										}
									}}
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
						{activeFileName
							? `Save/Run ${activeFileName.split("/").pop()}`
							: "Select a file"}
					</button>
				</div>
				{activeFileName ? (
					<Editor
						language={
							extensionToLanguage[
								activeFileName.split(".").pop()!
							]
						}
						className="w-full grow"
						theme="vs-dark"
						path={activeFileName}
						onMount={(editor) => {
							setEditor(editor);
						}}
						onChange={() =>
							setFileToSaved((prev) => ({
								...prev,
								[activeFileName]: false,
							}))
						}
					/>
				) : (
					<div className="bg-stone-900 grow text-white flex items-center justify-center">
						Select a file to Edit
					</div>
				)}
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
