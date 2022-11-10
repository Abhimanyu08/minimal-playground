import { JsxAttribute } from "typescript";

export class FileStructure {
	name: string;
	parent: FileStructure | null;
	children: FileStructure[];
	type: "file" | "folder";
	depth: number;

	constructor(
		name: string,
		children: FileStructure[],
		type: "file" | "folder",
		depth: number,
		parent: FileStructure | null
	) {
		this.name = name;
		this.parent = parent;
		this.children = children;
		this.type = type;
		this.depth = depth;
	}

	addChild(child: FileStructure) {
		this.children?.push(child);
	}

	toString() {
		if (this.type === "file") return this.name;
		const s1 = `${this.name}`;
		let s2 = ``;
		for (let child of this.children) {
			s2 += child.toString();
		}
		return s1 + `-> [${s2}]`;
	}

	toJsx(): JSX.Element {
		return (
			<div className={`flex flex-col px-${this.depth}`}>
				<span>{this.name}</span>
				{this.children.map((c) => c.toJsx())}
			</div>
		);
	}

	static fromString(fsString: string) {
		const pattern = /(\..*?):\r\n(.*?)\r\n/g;
		const matchedArr = Array.from(fsString.matchAll(pattern));

		const addressToStruct: Record<string, FileStructure> = {};
		matchedArr.map((match) => {
			const address = match.at(1);
			const filesAndFolders = match.at(2);
			if (!address) return;
			let name, parent;
			if (address === ".") {
				name = ".";
				parent = null;
			} else {
				const matchForNameAndParent = /(\..*?)\/([^\/]*)$/.exec(
					address
				);
				parent = matchForNameAndParent?.at(1);
				name = matchForNameAndParent?.at(2);
			}
			console.log("parent, name ->", parent, name);
			let parentStruct: FileStructure | null = null;
			if (parent && Object.hasOwn(addressToStruct, parent)) {
				parentStruct = addressToStruct[parent];
			}
			const depth = Array.from(address.matchAll(/\//g)).length;
			const files = filesAndFolders
				?.split("\t")
				.filter((f) => /\./.test(f))
				.map(
					(f) =>
						new FileStructure(
							f,
							[],
							"file",
							depth + 1,
							parentStruct
						)
				);
			const struct = new FileStructure(
				name!,
				files || [],
				"folder",
				depth,
				parentStruct
			);
			if (parentStruct) {
				parentStruct.addChild(struct);
			}
			addressToStruct[address] = struct;
		});
		return addressToStruct["."];
	}
}
