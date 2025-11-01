# 🛡️ AegiShield - Your Privacy Co-Pilot

**A new class of privacy tool, made possible by Chrome's on-device AI.**

AegiShield is a Chrome extension that acts as your personal privacy guardian, protecting you from accidentally sharing sensitive information with cloud-based AI and other websites. It uses a sophisticated **dual-engine detection system**—combining the contextual intelligence of **on-device AI (Gemini Nano)** with the reliability of code-based rules—to scan your text for privacy risks in real-time, helping you anonymize them before you click "send."


## ✨ Features

### 🧠 Intelligent & Comprehensive Detection
AegiShield's dual-engine system finds what other tools miss, without ever sending your data to the cloud:

- **On-Device AI Detection (The Core Innovation):**
  - **Contextual PII:** Finds full names, physical addresses, medical info, and government IDs by understanding the context of your sentences.
  - **Subtle Secrets:** Identifies credentials like passwords embedded in connection strings (`mongodb://user:PASSWORD@...`).

- **Code-Based Guardrails (For Instant Feedback & 100% Reliability):**
  - **Instant Results:** A code-based RegEx scan provides an immediate preview of common risks while the AI processes.
  - **Guaranteed Detection:** Ensures 100% reliability for critical patterns like emails, API Keys, AWS Keys, GitHub Tokens, and more.

### 🎯 Smart, Frictionless Protection

- **Instant Privacy Sandbox:** A single click on the shield icon opens an in-page modal for immediate review.
- **Visual Risk Assessment:** Color-coded severity indicators (Red/Orange/Blue) help you prioritize.
- **One-Click Anonymization:** Anonymize any or all detected items with a single click.
- **User-Centric Design:** The shield icon is **draggable** so it never gets in your way, and you can create a **domain whitelist** to decide exactly where Aegis should be active.

### 🎨 Beautiful, Modern UI

- **Dark/Light Theme Support**: Comfortable viewing in any environment.
- **Polished Interactions**: From the glowing shield icon to the fluid modal animations, the UI is designed to feel professional and trustworthy.

### 🔐 Uncompromising Privacy-First Design

- **100% On-Device Processing**: All scanning, including the AI analysis, happens locally on your machine.
- **Zero Data Collection**: Your text never leaves your device. Period.
- **No Servers**: No external API calls are made for detection.
- **Open Source**: Transparent, auditable code for complete peace of mind.

## 🚀 Installation & Setup

### Prerequisites

- **Google Chrome** v127+ (Canary/Beta recommended)
- **Node.js** & **npm** (for the one-time build process)
- **22 GB free disk space** (for the one-time Gemini Nano AI model download)

### Installation Steps

#### Step 1: Clone or Download the Repository

Clone the repository and navigate to the project directory:

    git clone https://github.com/IbDiallo-7/aegishield-extension.git
    cd aegishield-extension

#### Step 2: Install Dependencies & Build CSS

Install the required packages and build the CSS:

    npm install
    npm run build:css

For development, you can use `npm run watch:css` to auto-rebuild styles on change.

#### Step 3: Enable On-Device AI in Chrome (Required)

AegiShield is built around Chrome's on-device AI. This is a one-time setup:

1.  **Enable Flags:** Go to `chrome://flags` and enable these two flags:
    *   `#prompt-api-for-gemini-nano`
    *   `#optimization-guide-on-device-model` (choose the "Bypass..." option)
2.  **Relaunch Chrome.**
3.  **Download Model:** Go to `chrome://components`, find **"Optimization Guide On Device Model,"** and click "Check for update." Wait for the download to complete (this can take several minutes).

#### Step 4: Load the Extension

1.  Go to `chrome://extensions`.
2.  Enable "Developer mode."
3.  Click "Load unpacked" and select the `aegishield-extension` folder.
4.  Pin the AegiShield icon to your toolbar for easy access.

## 📖 How to Use

1.  **Type Anywhere:** Start typing in any text field on any site (e.g., ChatGPT, Gmail, Reddit). The draggable `🛡️` icon will appear.
2.  **Click to Scan:** Click the shield. The Aegis "Privacy Sandbox" will instantly open.
3.  **Review Findings:** Code-based findings appear immediately. A badge will show `[AI Scanning...]` and then update with any additional contextual PII found by the on-device AI.
4.  **Anonymize:** Review the color-coded findings and use the checkboxes or quick-action buttons to select what you want to anonymize.
5.  **Apply & Share:** Click "Apply Changes." Your text is instantly updated on the webpage, safe to share.

## 🛠️ Technical Architecture

AegiShield is a Manifest V3 extension built with a "privacy by design" philosophy. Its core is a **dual-engine detection system** that intelligently manages performance and accuracy.


When a user initiates a scan, we first run a **fast, code-based RegEx scan** to provide instant feedback on structured PII. Simultaneously, we begin a **deeper, contextual scan using the on-device Prompt API**. When the AI scan completes (typically 1-4 seconds), its unique findings are seamlessly merged into the UI. This architecture provides the best of both worlds: the instant feedback of traditional tools and the deep understanding of next-generation AI.

### Why On-Device AI is Essential

This project would be impossible without Chrome's on-device Prompt API. The need to scan a user's sensitive, real-time text input demands:
1.  **Low Latency:** While not zero, the on-device model is significantly faster than any cloud-based round trip, making a responsive UX possible.
2.  **Absolute Privacy:** The text cannot and should not be sent to a cloud server for analysis.

The on-device model is the only technology that meets both of these requirements, enabling this new class of "trustware."

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with 🛡️ by a developer who cares about privacy.**