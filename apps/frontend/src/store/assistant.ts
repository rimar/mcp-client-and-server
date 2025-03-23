import { fetchGuitars, type Guitar } from "@/utils/apis";
import { Store } from "@tanstack/store";

export const showAIAssistant = new Store(false);

export const guitarList = new Store<Guitar[]>([]);

fetchGuitars().then((data) => guitarList.setState(() => data));
