import { NextRequest } from "next/server";

export const config = {
    runtime: 'experimental-edge'
}

const handler = async (req: NextRequest) => {

    const resp = await fetch("https://api.rce-blog.xyz/playground" as string, {
        method: req.method,
        headers: {
            "Content-Type": "application/json",
        },
        body: req.body,
    });


    const body = await resp.json()

    if (!body) {

        return new Response("", { status: resp.status, headers: { 'content-type': 'application/json' } })
    }

    return new Response(JSON.stringify(body), { status: resp.status, headers: { 'content-type': 'application/json' } })

}

export default handler