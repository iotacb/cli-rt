import { useContext } from "react";
import { PageContext } from "../contexts/PageContext";

// ----------------------------------------------------------------------

const usePage = () => useContext(PageContext);

export default usePage;
