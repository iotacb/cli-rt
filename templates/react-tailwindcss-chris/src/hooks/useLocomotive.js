import { useRef, useEffect, useState } from "react";

import LocomotiveScroll from "locomotive-scroll";
import "locomotive-scroll/src/locomotive-scroll.scss";

const useLocomotive = (ref) => {
	const locomotiveScrollRef = useRef();

	useEffect(() => {
		if (ref.current) {
			locomotiveScrollRef.current = new LocomotiveScroll({
				el: ref.current,
				smooth: true,
			});
		}

		return () => {
			locomotiveScrollRef.current.destroy();
		};
		// eslint-disable-next-line
	}, [ref]);

	return [locomotiveScrollRef];
};

const useLocomotiveScroll = (locomotive, onScroll = () => {}) => {
	const [scroll, setScroll] = useState({ scrollX: 0, scrollY: 0 });

	useEffect(() => {
		if (locomotive) {
			locomotive.on("scroll", (e) => {
				setScroll({
					scrollX: e.scroll.x,
					scrollY: e.scroll.y,
				});
				onScroll(e);
			});
		}
	}, [locomotive]);
	return scroll;
};

export { useLocomotive, useLocomotiveScroll };
