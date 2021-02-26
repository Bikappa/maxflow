export function sleep(ms: number) {
    const timeout = Math.max(0, ms)
    return new Promise(resolve => setTimeout(resolve, timeout))
}