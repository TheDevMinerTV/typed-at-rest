import * as S from "@effect/schema/Schema";
import * as Fn from "effect/Function";

export const DateSchema = Fn.pipe(S.string, S.dateFromString);
export const BigintFromString = S.transform(
	S.string,
	S.bigint,
	(a1) => BigInt(a1),
	(a1) => a1.toString()
);
