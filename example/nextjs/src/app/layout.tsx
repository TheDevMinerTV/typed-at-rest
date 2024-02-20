import "../globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" style={{ minHeight: "100vh" }}>
			<body
				style={{
					minHeight: "100vh",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				{children}
			</body>
		</html>
	);
}
