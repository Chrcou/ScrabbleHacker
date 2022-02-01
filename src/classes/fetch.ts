export async function getTextFile(url: string) {
let response=await fetch(url)
let json=await response.json()
return json
}
