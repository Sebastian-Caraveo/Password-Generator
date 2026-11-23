"use strict";

const characterSets = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>?/",
};

const slider = document.querySelector("#length-slider");
const lengthValue = document.querySelector("#length-value");
const passwordOutput = document.querySelector("#password-output");
const generateButton = document.querySelector("#generate-button");
const copyButton = document.querySelector("#copy-button");
const message = document.querySelector("#message");
const strengthMeter = document.querySelector("#strength-meter");
const strengthLabel = document.querySelector("#strength-label");
const checkboxes = Object.keys(characterSets).map((name) =>
  document.querySelector(`#${name}`),
);

function randomInt(max) {
  const range = 256 - (256 % max);
  const byte = new Uint8Array(1);

  do {
    crypto.getRandomValues(byte);
  } while (byte[0] >= range);

  return byte[0] % max;
}

function getEnabledSets() {
  return checkboxes
    .filter((checkbox) => checkbox.checked)
    .map((checkbox) => characterSets[checkbox.id]);
}

function generatePassword(length, sets) {
  const pool = sets.join("");
  const characters = sets.map((set) => set[randomInt(set.length)]);

  while (characters.length < length) {
    characters.push(pool[randomInt(pool.length)]);
  }

  for (let index = characters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [characters[index], characters[swapIndex]] = [
      characters[swapIndex],
      characters[index],
    ];
  }

  return characters.join("");
}

function updateStrength(length, poolSize) {
  const entropy = length * Math.log2(poolSize);
  let level;

  if (entropy >= 100) {
    level = 4;
  } else if (entropy >= 70) {
    level = 3;
  } else if (entropy >= 40) {
    level = 2;
  } else {
    level = 1;
  }

  const labels = ["", "Weak", "Fair", "Strong", "Excellent"];
  strengthMeter.dataset.level = String(level);
  strengthLabel.dataset.level = String(level);
  strengthLabel.textContent = labels[level];
  strengthMeter.setAttribute("aria-label", `Password strength: ${labels[level]}`);
}

function updateSlider() {
  const min = Number(slider.min);
  const max = Number(slider.max);
  const value = Number(slider.value);
  const progress = ((value - min) / (max - min)) * 100;

  lengthValue.value = String(value);
  slider.style.setProperty("--slider-progress", `${progress}%`);
}

function showMessage(text) {
  message.textContent = text;
}

function handleGenerate() {
  const sets = getEnabledSets();

  if (sets.length === 0) {
    showMessage("Choose at least one character type to generate a password.");
    return;
  }

  if (!globalThis.crypto || typeof globalThis.crypto.getRandomValues !== "function") {
    showMessage("Secure password generation is not available in this browser.");
    return;
  }

  const password = generatePassword(Number(slider.value), sets);
  passwordOutput.value = password;
  passwordOutput.textContent = password;
  passwordOutput.classList.remove("is-empty");
  copyButton.disabled = false;
  copyButton.setAttribute("aria-label", "Copy password");
  updateStrength(password.length, sets.join("").length);
  showMessage("");
}

async function copyPassword() {
  const password = passwordOutput.value;

  if (!password) {
    return;
  }

  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(password);
    } else {
      const temporaryInput = document.createElement("textarea");
      temporaryInput.value = password;
      temporaryInput.setAttribute("readonly", "");
      temporaryInput.style.position = "fixed";
      temporaryInput.style.opacity = "0";
      document.body.append(temporaryInput);
      temporaryInput.select();
      const copied = document.execCommand("copy");
      temporaryInput.remove();

      if (!copied) {
        throw new Error("The browser could not copy the password.");
      }
    }

    copyButton.setAttribute("aria-label", "Password copied");
    showMessage("Password copied to clipboard.");
    window.setTimeout(() => {
      copyButton.setAttribute("aria-label", "Copy password");
      if (message.textContent === "Password copied to clipboard.") {
        showMessage("");
      }
    }, 1800);
  } catch (error) {
    showMessage("Could not copy the password. Please select and copy it manually.");
    console.error("Password clipboard copy failed:", error);
  }
}

slider.addEventListener("input", updateSlider);
generateButton.addEventListener("click", handleGenerate);
copyButton.addEventListener("click", copyPassword);

checkboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", () => {
    if (getEnabledSets().length === 0) {
      showMessage("Choose at least one character type to generate a password.");
    } else {
      showMessage("");
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && event.target === document.body) {
    handleGenerate();
  }
});

updateSlider();
