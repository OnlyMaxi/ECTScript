// ==UserScript==
// @name         ECTScript
// @namespace    https://github.com/OnlyMaxi/ECTScript
// @version      0
// @description  for free ECTS click here!
// @match        https://tuwel.tuwien.ac.at/course/view.php?id=67085
// @match        https://tuwel.tuwien.ac.at/mod/scorm/view.php?id=2373665
// @match        https://tuwel.tuwien.ac.at/mod/scorm/view.php?id=2373671
// @match        https://tuwel.tuwien.ac.at/mod/scorm/player.php
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const url = window.location.href;

    switch(url) {
        case "https://tuwel.tuwien.ac.at/course/view.php?id=67085":
            runMainCoursePage();
            break;
        case "https://tuwel.tuwien.ac.at/mod/scorm/view.php?id=2373665":
            startModule();
            break;
        case "https://tuwel.tuwien.ac.at/mod/scorm/view.php?id=2373671":
            startModule();
            break;
        case "https://tuwel.tuwien.ac.at/mod/scorm/player.php":
            runPlayerPage();
            break;
    }

    function runMainCoursePage() {
        const allSections = document.querySelectorAll(".section-item");
        const allCompletionWrappers = document.querySelectorAll(".dropdown");
        if (allSections.length !== 8) console.log("not the right amount of sections, you might be in the wrong course!");
        for (let i = 3; i < 8; i++) {
            //search for completion
            const currentSection = allSections[i];
            const currentCompletionWrapper = allCompletionWrappers[i + 2];
            const currentCompletion = currentCompletionWrapper.querySelector(':scope > button');
            if (currentCompletion.innerText.includes("Erledigt")) console.log("module " + (i - 2) + " completed!");
        }
    }

    function startModule() {
        const startButton = document.querySelector("#n");
        startButton.click();
    }


    function runDiversityBasicsContent() {
        const nextLesson = document.querySelecter(".next-lesson__link");
    }

    function runPlayerPage() {
        //TODO: get name of Module


        //test for first module until first in-between-quiz
        nextLesson(1);
        continueButton(12);
        nextLesson(1);
    }

    function nextLesson(n) {
        for (let i = 0; i < n; i++) {
            let nextLessonButton = document.querySelector(".next-lesson__name");
            if (nextLessonButton) nextLessonButton.click();
        }
    }

    function continueButton(n) {
        for (let i = 0; i < n; i++) {
            console.log("continueButton times " + i);
            const innerApp = document.querySelector("#app")
            innerApp.scrollBy(0, 10000);
            document.querySelector(".continue-btn").click();
        }
    }
})();