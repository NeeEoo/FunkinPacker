declare module '@jvitela/mustache-wax' {
	export default function wax(mustache: any, formatters?: Record<string, Formatter>): void;
}

type Formatter = (...args: any[]) => any;

declare namespace Mustache {
	let Formatters: Record<string, Formatter>;
}