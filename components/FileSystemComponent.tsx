import { Dispatch, SetStateAction, useState } from "react";
import { FileStructure } from "../utils/DataStructure";

const depthToPadding: Record<number, string> = {
	1: "px-4",
	2: "px-8",
	3: "px-12",
	4: "px-16",
	5: "px-20",
};

function FileSystemComponent({
	fileRoot,
	id: key,
	setActiveFileName,
}: {
	fileRoot: FileStructure;
	id: number;
	setActiveFileName: Dispatch<SetStateAction<string>>;
}) {
	const [open, setOpen] = useState(true);
	// const { setActiveFileName } = useContext(FileContext);

	if (fileRoot.type === "file") {
		return (
			<div
				className={`${
					depthToPadding[fileRoot.depth]
				} text-white select-none underline`}
				onClick={() => {
					setActiveFileName(fileRoot.address);
				}}
			>
				{fileRoot.name}
			</div>
		);
	}
	return (
		<div className={`w-max flex flex-col items-start`}>
			<div className={`${depthToPadding[fileRoot.depth]}`}>
				<span
					className={`select-none underline ${
						open ? "text-blue-400" : "text-white"
					}`}
					onClick={() => setOpen((prev) => !prev)}
				>
					{fileRoot.name === "." ? "/app" : fileRoot.name}
				</span>
			</div>

			{open &&
				fileRoot.children.map((c, idx) => (
					<FileSystemComponent
						fileRoot={c}
						setActiveFileName={setActiveFileName}
						id={c.depth + key + idx}
						key={c.depth + key + idx}
					/>
				))}
		</div>
	);
}

export default FileSystemComponent;
