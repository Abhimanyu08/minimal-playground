export async function sendRequestToRceServer(method: "POST" | "DELETE", body: { language?: string, containerId?: string, code?: string, fileName?: string }) {
    if (window.location.hostname === "localhost") {

        const resp = fetch("http://localhost:5000" as string, {
            method,
            mode: "cors",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        return resp
    }

    const resp = await fetch(`/api/sendReqToRceServer`, {
        method,
        body: JSON.stringify(body)
    })
    return resp

}