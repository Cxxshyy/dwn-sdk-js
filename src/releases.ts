import * as fs from "fs";
import { execSync } from "child_process";

// Define the versioning scheme that increments the date and increment number for unstable releases
const versioningScheme = "<sem-ver>-unstable-YYYYMMDD-<increment>";

// Get the current date and time in the YYYYMMDD format
const currentDate = new Date().toISOString().slice(0, 10).replace(/-/g, "");

// Get the latest commit message from the git log
const latestCommitMessage = execSync("git log -1 --pretty=%B").toString().trim();

// Check if the latest commit message contains the string "official release"
if (latestCommitMessage.includes("official release")) {
  // If it does, leave the <sem-ver> portion of the version number unchanged
  console.log("The latest commit is an official release. No version bump needed.");
} else {
  // If it doesn't, apply the versioning scheme to increment the date and increment number
  // Replace the YYYYMMDD placeholder in the versioning scheme with the current date
  const newVersion = versioningScheme.replace("YYYYMMDD", currentDate);

  // Read the current version number from the package.json file
  const packageJson = JSON.parse(fs.readFileSync("package.json", "utf8"));
  const currentVersion = packageJson.version;

  // Check if the new version is different from the current version
  if (currentVersion !== newVersion) {
    // If it is, update the package.json file with the new version
    packageJson.version = newVersion;
    fs.writeFileSync("package.json", JSON.stringify(packageJson, null, 2));

    // Log the new version number
    console.log(`Updated version number to ${newVersion}`);
  } else {
    // If it isn't, log a message indicating that the version is unchanged
    console.log("The version number is already up to date.");
  }
}