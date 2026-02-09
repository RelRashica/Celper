# 💀 Celper (C-Helper)
### *Stop leaking memory like a rookie.*

---

## 📖 Overview
**Celper** is a brutal, real-time memory leak detector for VS Code. Built for developers learning **C**, it ensures you never leave a `malloc` hanging. If you forget to `free()`, Celper roasts you in the "Problems" tab.



---

## 🔥 Key Features

* **Variable Tracking:** Uses a `Map<string, number[]>` to track every specific allocation.
* **The "Double Malloc" Catch:** Flags you if you overwrite a pointer before freeing the old memory.
* **Fatal Return Check:** Prevents you from `return`-ing out of a function while memory is still leaked.
* **Zero Sugarcoating:** Direct, unhinged error messages that tell it like it is.

---

## 🛠️ How it Works (The Logic)

Celper doesn't just scan for words; it tracks the **lifecycle** of your pointers.

| Action | What Celper Does |
| :--- | :--- |
| `malloc()` | Pushes the line number to the variable's "Active Stack". |
| `free()` | Pops the latest line number. Balance restored. |
| `return` | Checks if any stacks are non-empty. If yes → **FATAL ERROR**. |
| **End of File** | Scans for any orphaned allocations left over. |



---

## 🚀 Installation & Dev
To run this locally and help Celper roast more code:

1.  Clone the repo: `git clone https://github.com/RelRashica/Celper.git`
2.  Install dependencies: `npm install`
3.  Press `F5` to open the **Extension Development Host**.
4.  Open any `.c` file and start leaking memory!

---

## ⚠️ Known Limitations
> **Disclaimer:** Celper is a static scanner. It’s perfect for learning and simple scripts, but it doesn't track pointers across different files or complex function arguments... *yet.*

---

## 👨‍💻 Author
**RelRashica** 

## 💬 Connect
Got questions or want to roast my regex? 

[![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](gurandaa)

**Discord User:** `gurandaa`
