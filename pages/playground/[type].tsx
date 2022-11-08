import { useRouter } from "next/router";

import React, { useRef, useEffect, useState } from "react";
import Editor, { Monaco } from "@monaco-editor/react";

function Playground() {
	const [filetoCode, setFileToCode] = useState<Record<string, string>>({
		script: "print('Hello world')",
		file: "print('different file')",
	});
	const [activeFileName, setActiveFileName] = useState("script");

	return (
		<div className="w-fit h-fit p-4 border-2 border-black m-2">
			<div className="flex gap-2">
				{Object.keys(filetoCode).map((val) => (
					<button
						key={val}
						disabled={activeFileName === val}
						onClick={() => {
							setActiveFileName(val);
						}}
						className="border-2 border-gray-500"
					>
						{val}
					</button>
				))}
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
