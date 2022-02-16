import { BrowserRouter, Route, Routes } from "react-router-dom";

import Home from "./pages/Home"

function Router() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/">
					<Route index element={<Home/>} />
					<Route path="" element={} />
				</Route>
			</Routes>
		</BrowserRouter>
	);
}

export default Router;
