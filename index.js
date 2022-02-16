#!/usr/bin/env node

import chalk from "chalk";
import inquirer from "inquirer";
import fs from "fs";
import ncp from "ncp";
import path from "path";
import commandLineArgs from "command-line-args";
import figlet from "figlet";
import { promisify } from "util";
import { createSpinner } from "nanospinner";
import { projectInstall, install } from "pkg-install";

const access = promisify(fs.access);
const copy = promisify(ncp);

let templateType;
let doInstallFirebase;
let doInstallCustomDependencies;
let projectName = "untitled-project";

let test = false;

const optionDefinitions = [
	{ name: "packages", alias: "p", type: String, multiple: true },
	{ name: "template", alias: "t", type: String },
	{ name: "firebase", alias: "f", type: Boolean },
	{ name: "test", alias: "g", type: Boolean },
	{ name: "name", alias: "n", type: String },
	{ name: "help", alias: "h", type: Boolean },
];

const args = commandLineArgs(optionDefinitions);

let customDependencies = {};
if (args.packages) {
	doInstallCustomDependencies = args.packages.length > 0;
	args.packages.forEach((p) => {
		const dependency = p.includes("@") ? p.split("@")[0] : p;
		const version = p.includes("@") ? p.split("@")[1] : "latest";
		customDependencies[dependency] = version;
	});
}

if (args.template) {
	templateType = args.template;
}

if (args.firebase) {
	doInstallFirebase = true;
}

if (args.name) {
	projectName = args.name;
}

if (args.test) {
	test = true;
}

async function printTitle() {
	console.clear();
	console.log(
		chalk.cyan.bold(
			figlet.textSync("CLI - RT", {
				horizontalLayout: "default",
				verticalLayout: "default",
			})
		)
	);
	return true;
}

async function copyTemplateFiles(options) {
	return copy(options.templateDirectory, options.targetDirectory, {
		clobber: false,
	});
}

async function createProject(options) {
	options = {
		...options,
		targetDirectory: `${process.cwd()}/${options.project}`,
	};

	const currentFileUrl = import.meta.url;
	console.log(currentFileUrl);
	console.log(path.dirname(currentFileUrl));
	console.log(new URL(currentFileUrl).pathname);

	const templateDirectory = path.resolve(
		new URL(currentFileUrl).pathname.substring(
			test ? 0 : process.platform === "win32" ? 3 : 0
		),
		"../templates",
		options.template.toLowerCase()
	);

	options.templateDirectory = templateDirectory;

	let exists = false;

	try {
		await access(templateDirectory, fs.constants.R_OK).then(() => {
			exists = true;
		});
	} catch (err) {
		console.error("%s Invalid template name", chalk.bgRed.bold("ERROR"));
		process.exit(1);
	}

	const spinner = createSpinner("Copying template...").start();

	if (exists) {
		await copyTemplateFiles(options).then(() => {
			spinner.success({
				text: `Successfully imported template ${chalk.cyan.bold(
					options.template
				)}!`,
			});
		});
	} else {
		spinner.error({
			text: `${chalk.red("ERROR")}! Oh, something went wrong. ${chalk.cyan(
				":c"
			)}`,
		});
		process.exit(1);
	}

	await installFirebase(options);
	await installCustomDependencies(options);
	await installDependencies(options);

	return true;
}

async function installFirebase(options) {
	if (doInstallFirebase) {
		const firebaseSpinner = createSpinner("Installing firebase...").start();
		await install(
			{
				firebase: "^9.6.2",
			},
			{
				cwd: options.targetDirectory,
			}
		).then((result) => {
			if (result.failed) {
				firebaseSpinner.error({
					text: `${chalk.red(
						"ERROR"
					)}! Oh, something went wrong while installing firebase. ${chalk.cyan(
						":c"
					)}`,
				});
			} else {
				firebaseSpinner.success({ text: `Successfully installed firebase` });
			}
		});
	}
	return true;
}

async function installCustomDependencies(options) {
	if (doInstallCustomDependencies) {
		const customDependenciesSpinner = createSpinner(
			"Installing custom dependencies..."
		).start();
		await install(customDependencies, {
			cwd: options.targetDirectory,
		}).then((result) => {
			if (result.failed) {
				customDependenciesSpinner.error({
					text: `${chalk.red(
						"ERROR"
					)}! Oh, something went wrong while installing custom dependencies. ${chalk.cyan(
						":c"
					)}`,
				});
			} else {
				customDependenciesSpinner.success({
					text: `Successfully installed custom dependencies`,
				});
			}
		});
	}
	return true;
}

async function installDependencies(options) {
	const depSpinner = createSpinner("Installing dependencies...").start();
	projectInstall({
		cwd: options.targetDirectory,
	}).then((result) => {
		if (result.failed) {
			depSpinner.error({
				text: `${chalk.red(
					"ERROR"
				)}! Oh, something went wrong while installing the dependencies. ${chalk.cyan(
					":c"
				)}`,
			});
		} else {
			depSpinner.success({ text: `Successfully installed dependencies` });
			console.log(chalk.bgCyan.bold("DONE"));
		}
	});
}

async function askTemplateType() {
	const answers = await inquirer.prompt({
		name: "template_type",
		type: "list",
		message: "What template do you want to use?\n",
		choices: [
			"React",
			"React with Styled-Components",
			"React with TailwindCSS",
			"React (Chris's version)",
			"React (Pau's version)",
			"React with TailwindCSS (Chris's version)",
		],
		default() {
			return "React";
		},
	});
	templateType = answers.template_type;
	if (doInstallFirebase) {
		if (projectName === "untitled-project") {
			return askProjectName();
		} else {
			return handleTemplateType(templateType, projectName);
		}
	} else {
		return askFirebase();
	}
}

async function askFirebase() {
	const answers = await inquirer.prompt({
		name: "install_firebase",
		type: "confirm",
		message: "Do you want to install firebase?\n",
		default() {
			return false;
		},
	});
	doInstallFirebase = answers.install_firebase;
	if (projectName === "untitled-project") {
		return askProjectName();
	} else {
		return handleTemplateType(templateType, projectName);
	}
}

async function askProjectName() {
	const answers = await inquirer.prompt({
		name: "project_name",
		type: "input",
		message: "What's the name of your project?",
		default() {
			return "untitled-project";
		},
	});

	return handleTemplateType(templateType, answers.project_name);
}

async function handleTemplateType(answer, projectName) {
	if (
		answer.toLowerCase() === "react (pau's version)" ||
		answer.toLowerCase() === "react-pau"
	) {
		await createProject({
			template: "react-pau",
			project: projectName,
		});
	} else if (answer.toLowerCase() === "react") {
		await createProject({
			template: "react",
			project: projectName,
		});
	} else if (
		answer.toLowerCase() === "react (chris's version)" ||
		answer.toLowerCase() === "react-chris"
	) {
		await createProject({
			template: "react-chris",
			project: projectName,
		});
	} else if (
		answer.toLowerCase() === "react with styled-components" ||
		answer.toLowerCase() === "react-styled-components" ||
		answer.toLowerCase() === "styled-components"
	) {
		await createProject({
			template: "react-styled-components",
			project: projectName,
		});
	} else if (
		answer.toLowerCase() === "react with tailwindcss" ||
		answer.toLowerCase() === "react-tailwind" ||
		answer.toLowerCase() === "react-tailwindcss" ||
		answer.toLowerCase() === "tailwindcss" ||
		answer.toLowerCase() === "tailwind"
	) {
		await createProject({
			template: "react-tailwindcss",
			project: projectName,
		});
	} else if (
		answer.toLowerCase() === "react-tailwind-chris" ||
		answer.toLowerCase() === "tailwindcss-chris" ||
		answer.toLowerCase() === "tailwind-chris" ||
		answer.toLowerCase() === "react with tailwindcss (chris's version)"
	) {
		await createProject({
			template: "react-tailwindcss-chriss",
			project: projectName,
		});
	}
}

async function printHelp() {
	console.log(`${chalk.bgMagenta("React template CLI help:")}`);
	console.log(
		`${chalk.cyan(
			"cli-rt [-p | --packages] dependency1 dependency2..."
		)} 	      	| 	${chalk.bgYellow("Install custom dependencies to the template")}`
	);
	console.log(
		`${chalk.cyan(
			"cli-rt [-t | --template] [react, styled-components, tailwind]"
		)} 	| 	${chalk.bgYellow("Select the template")}`
	);
	console.log(
		`${chalk.cyan("cli-rt [-f | --firebase]")}  				      	| 	${chalk.bgYellow(
			"Install firebase to the template"
		)}`
	);
	console.log(
		`${chalk.cyan("cli-rt [-n | --name]")}  					      	| 	${chalk.bgYellow(
			"Set the name of the project"
		)}`
	);
	console.log(
		`${chalk.cyan("cli-rt [-h | --help]")}  					      	| 	${chalk.bgYellow(
			"Display this help list"
		)}`
	);
}

console.clear();
printTitle();

if (args.help) {
	await printHelp();
} else {
	if (templateType == null) {
		await askTemplateType();
	} else {
		if (doInstallFirebase) {
			if (projectName === "untitled-project") {
				await askProjectName();
			} else {
				await handleTemplateType(templateType, projectName);
			}
		} else {
			await askFirebase();
		}
	}
}
