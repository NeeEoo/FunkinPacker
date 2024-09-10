import * as en from "./languages/en.json";
import * as de from "./languages/de.json";
import * as es from "./languages/es.json";
import * as ru from "./languages/ru.json";
import * as zh from "./languages/zh-cn.json";
import * as pt_br from "./languages/pt-br.json";
import * as ca_fr from "./languages/ca-fr.json";
import * as it from "./languages/it.json";

export type Language = {
	lang: string;
	name: string;
	mapping: Record<string, string>;
}

export function getLanguageByCode(code: string): Language {
	for (const item of languages) {
		if (item.lang === code) return item;
	}
	return languages[0];
}

export const languages: Language[] = [
	{ lang: "en", name: "english", mapping: en },
	{ lang: "de", name: "deutsch", mapping: de },
	{ lang: "es", name: "español", mapping: es },
	{ lang: "ru", name: "русский", mapping: ru },
	{ lang: "zh-cn", name: "简体中文", mapping: zh },
	{ lang: "pt-br", name: "português (brasil)", mapping: pt_br }, // by @CrowPlexus
	{ lang: "ca-fr", name: "français (canadien)", mapping: ca_fr }, // by @thatoneidiotxav
	{ lang: "it", name: "italiano", mapping: it }, // by @NexIsDumb
] as const;

const ALL_KEYS = Object.keys(languages[0].mapping);

if(DEBUG) {
	for(const item of languages) {
		for(const key of ALL_KEYS) {
			if(!item.mapping[key]) {
				console.warn(`Missing key in language ${item.lang}.json: ${key}`);
			}
		}
	}
}