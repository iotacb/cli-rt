import { motion } from "framer-motion";
import React, { useRef, useEffect, useState } from "react";

import { useLocomotive } from "../hooks/useLocomotive";
import usePage from "../hooks/usePage";

function Page({ children }) {
	const { onChangeLocomotive } = usePage();
	const ref = useRef();
	const [locomotiveScroll] = useLocomotive(ref);
	const [locomotiveStart, setLocomotive] = useState(false);

	useEffect(() => {
		if (locomotiveScroll.current) {
			onChangeLocomotive(locomotiveScroll);
		}
		// eslint-disable-next-line
	}, [locomotiveScroll]);

	useEffect(() => {
		if (locomotiveStart) {
			locomotiveScroll.current.update();
		}
		// eslint-disable-next-line
	}, [locomotiveStart]);

	return (
		<motion.div
			ref={ref}
			data-scroll-container
			initial={{
				opacity: 0,
			}}
			animate={{
				opacity: 1,
			}}
			onAnimationComplete={() => {
				setLocomotive(true);
			}}
		>
			{children}
		</motion.div>
	);
}

export default Page;
