import * as S from "@effect/schema/Schema";
import * as Fn from "effect/Function";

export const DateSchema = Fn.pipe(S.string, S.dateFromString);
export const BigintFromString = S.bigint;
