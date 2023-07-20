import { AppProps } from "next/app";
import "./globals.css";

export default function CustomApp({ Component, pageProps }: AppProps) {
	return <Component {...pageProps} />;
}
