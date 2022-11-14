import { JsxAttribute } from "typescript";
import FileSystemComponent from "../components/FileSystemComponent";

export class FileStructure {
	name: string;
	children: FileStructure[];
	type: "file" | "folder";
	depth: number;
	address: string;
	constructor(
		name: string,
		children: FileStructure[],
		type: "file" | "folder",
		depth: number,
		address: string
	) {
		this.name = name;
		this.children = children;
		this.type = type;
		this.depth = depth;
		this.address = address
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

	// toJsx(): JSX.Element {
	// 	return <FileSystemComponent fileRoot={this} />;
	// }

	static fromString(fsString: string) {
		const pattern = /(\..*?):(\r\n(.*?))?\r\n/g;
		const matchedArr = Array.from(fsString.matchAll(pattern));
		const addressToStruct: Record<string, FileStructure> = {};
		matchedArr.map((match) => {
			const address = match.at(1);
			const filesAndFolders = match.at(3);
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
			let parentStruct: FileStructure | null = null;
			if (parent && Object.hasOwn(addressToStruct, parent)) {
				parentStruct = addressToStruct[parent];
			}
			const depth = Array.from(address.matchAll(/\//g)).length;
			const files = filesAndFolders
				?.split(/[\t' ']/)
				.filter((f) => f.split('.').length === 2)
				.map((f) => new FileStructure(f, [], "file", depth + 1, `${address}/${f}`));
			const struct = new FileStructure(
				name!,
				files || [],
				"folder",
				depth,
				address
			);
			if (parentStruct) {
				parentStruct.addChild(struct);
			}
			addressToStruct[address] = struct;
		});
		return addressToStruct["."];
	}
}
