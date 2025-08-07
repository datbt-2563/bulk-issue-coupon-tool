import * as fs from "fs";
import * as path from "path";

interface ScriptOption {
  name: string;
  description: string;
  file: string;
}

const scripts: ScriptOption[] = [
  {
    name: "coupon-mos",
    description: "Generate MOS coupon codes with pattern B[6digits]2[6digits]B",
    file: "./coupon-mos",
  },
  {
    name: "general-16",
    description: "Generate 16-digit general codes",
    file: "./general_16",
  },
  {
    name: "pos12",
    description: "Generate POS unit codes with pattern A[13digits]C",
    file: "./pos12",
  },
  {
    name: "deleted-csv",
    description: "Delete all CSV files in current directory",
    file: "./deleted-csv",
  },
];

function showMenu(): void {
  console.log("\n🎫 Bulk Issue Coupon Tool");
  console.log("=".repeat(30));
  scripts.forEach((script, index) => {
    console.log(`${index + 1}. ${script.name} - ${script.description}`);
  });
  console.log("0. Exit");
  console.log("=".repeat(30));
}

async function runScript(scriptPath: string): Promise<void> {
  try {
    await import(scriptPath);
  } catch (error) {
    console.error(`Error running script: ${error}`);
  }
}

function main(): void {
  const args: string[] = process.argv.slice(2);

  if (args.length === 0) {
    showMenu();
    console.log("\nUsage: npm run dev [script-name]");
    console.log("Example: npm run dev coupon-mos");
    return;
  }

  const scriptName: string = args[0];
  const script: ScriptOption | undefined = scripts.find(
    (s) => s.name === scriptName
  );

  if (!script) {
    console.error(`❌ Script '${scriptName}' not found.`);
    showMenu();
    return;
  }

  console.log(`🚀 Running ${script.name}...`);
  runScript(script.file);
}

if (require.main === module) {
  main();
}
