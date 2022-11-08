import Link from "next/link";

export default function Home() {
	return (
		<div className="bg-black text-white items-center justify-center flex flex-col h-screen w-screen">
			<p className="w-fit">Select a playground:</p>

			<div className="flex flex-row w-fit gap-2">
				<Link href={"/playground/python"}>
					<span className="underline">Python</span>
				</Link>
				<Link href={"/playground/node"}>
					<span className="underline">Node</span>
				</Link>
			</div>
		</div>
	);
}
