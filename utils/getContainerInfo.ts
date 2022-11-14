function getContainerInfo(info: string): { language: string | undefined; containerId: string | undefined } {

    const infoArray = info.split(';')
    const language = infoArray[0].split('-').pop()
    const containerId = infoArray[1].split('-').pop()


    return {
        language,
        containerId
    }
}

export default getContainerInfo