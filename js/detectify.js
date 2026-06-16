// js/detectify.js - The Humanity Triad Engine (Updated)

let startTime;
let pastedCharacterCount = 0;
let totalWordCount = 0;
let allWords = [];

// 1. Start the timer when the game loads
function startDetectifyTimer() {
    startTime = performance.now();
    pastedCharacterCount = 0;
    totalWordCount = 0;
    allWords = [];
}

// 2. Listen for Paste Events (Edit Distance)
function setupPasteListener(textAreaId) {
    const textArea = document.getElementById(textAreaId);
    if (textArea) {
        textArea.addEventListener('paste', (event) => {
            let pastedText = (event.clipboardData || window.clipboardData).getData('text');
            pastedCharacterCount += pastedText.length;
        });
    }
}

// 3. Calculate Type-Token Ratio (Lexical Diversity)
function calculateTTR(text) {
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];
    if (words.length === 0) return { ttr: 0, wordCount: 0 };
    const uniqueWords = new Set(words);
    return { ttr: uniqueWords.size / words.length, wordCount: words.length };
}

// 4. The Main Verification Function (returns everything)
function runDetectifyCheck(finalText) {
    // Calculate time taken in seconds
    let timeTakenSeconds = (performance.now() - startTime) / 1000;
    if (timeTakenSeconds < 0.1) timeTakenSeconds = 0.1; // prevent division by zero
    
    // Calculate Words Per Minute (WPM)
    const wordCount = (finalText.match(/\b\w+\b/g) || []).length;
    let wpm = (wordCount / timeTakenSeconds) * 60;
    if (wpm > 999) wpm = 999; // cap for display

    // Calculate Paste Ratio
    let pasteRatio = 0;
    if (finalText.length > 0) {
        pasteRatio = pastedCharacterCount / finalText.length;
    }

    // Calculate TTR
    const ttrData = calculateTTR(finalText);
    let ttr = ttrData.ttr;
    let wordCountActual = ttrData.wordCount;

    // Default: Human
    let isHuman = true;
    let reason = "Human";
    let message = "✅ Great! Your reasoning is authenticcc SUPERBbbb.";

    // THE RULES (The Humanity Triad)
    if (wpm > 120 && wordCountActual > 5) {
        isHuman = false;
        reason = "Speed";
        message = "⚠️ Heyyy that looked a bit automatedd. Please tryyy again in your OWN WORDS.";
    } else if (pasteRatio > 0.8 && finalText.length > 20) {
        isHuman = false;
        reason = "Paste";
        message = "⚠️ OHhh We detected pasted content. Type your own reasoningggg.";
    } else if (ttr < 0.4 && wordCountActual > 15) {
        isHuman = false;
        reason = "Diversity";
        message = "⚠️ Heyyy friend your wording seems repetitive. Use more varied vocabulary.";
    }

    // Return everything for display
    return {
        isHuman: isHuman,
        reason: reason,
        message: message,
        wpm: Math.round(wpm),
        pasteRatio: Math.round(pasteRatio * 100),
        ttr: Math.round(ttr * 100) / 100,
        wordCount: wordCountActual,
        duration: Math.round(timeTakenSeconds)
    };
}