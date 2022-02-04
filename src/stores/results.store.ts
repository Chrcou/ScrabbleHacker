import { writable } from "svelte/store";

let result=[]

export const store=writable(result)

