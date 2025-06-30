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

    function init() {
        const url = window.location.href;

        switch(url) {
            case "https://tuwel.tuwien.ac.at/course/view.php?id=67085":
                initMainCoursePage();
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
            default:
                //const hostName = window.location.hostname;
                //const pathName = window.location.pathname;
                if (window.location.hostname !== "localhost") {
                    console.log("ECTScript: ERROR!\n    this URL is not supported, are you on the right page?");
                    break;
                } else {
                    console.log("ECTScript: TESTING!\n    You are currently testing this script on a mock page.");
                }
                if (window.location.pathname === "/ECTScript/mock%20website/mainPage.html") {
                    initMainCoursePage();
                    break;
                }
        }
        console.log(localStorage.getItem("ECTScript-manually"));
        console.log(localStorage.getItem("ECTScript-running"));
    }

    function initMainCoursePage() {
        const scriptControlSectionItem = document.createElement("div")
        scriptControlSectionItem.classList.add("section-item");
        scriptControlSectionItem.id = "ECTScript-control"
        scriptControlSectionItem.style.marginBottom = "1rem";
        scriptControlSectionItem.innerHTML = `
            <div>
              ECTScript controls
            </div>
            <div>
              <span>
                <span class="ECTScript-start" id="startAutomatically">
                  Start the script with full automation (You will complete the course almost instantly)
                </span>
              </span>
              <div></div>
              <span>
                <span class="ECTScript-start" id="startManually">
                  Start the script with manual completion (You have to continue manually after tests)
                </span>
              </span>
            </div>
        `;

        scriptControlSectionItem.children[0].style.fontSize = "1.3rem";
        scriptControlSectionItem.children[1].style.color = "#0077ff";

        const firstSectionItem = document.querySelector(".section-item");
        firstSectionItem.parentElement.insertBefore(scriptControlSectionItem, firstSectionItem);

        document.querySelector("#startAutomatically").addEventListener("click", () => {
            localStorage.setItem("ECTScript-running", "true");
            localStorage.setItem("ECTScript-manually", "false");
            runMainCoursePage();
        });
        document.querySelector("#startManually").addEventListener("click", () => {
            runMainCoursePage();
            localStorage.setItem("ECTScript-running", "true");
            localStorage.setItem("ECTScript-manually", "true");
        });
    }

    function runMainCoursePage() {
        const allSectionItems = document.querySelectorAll(".section-item");
        const allCompletionWrappers = document.querySelectorAll(".dropdown.completion-dropdown");
        const allActivityNameLinks = document.querySelectorAll(".activityname > a");
        if (allSectionItems.length !== 9) {
            console.log("ECTScript: ERROR!\n    Not the right amount of sections, you might be in the wrong course!");
            return;
        }
        for (let i = 0; i < 5; i++) {
            //search for completion
            const currentSection = allSectionItems[i + 3];
            const currentCompletionWrapper = allCompletionWrappers[i];
            const currentCompletion = currentCompletionWrapper.querySelector(':scope > button');
            if (currentCompletion.innerText.includes("Erledigt")) {
                const completedMessage = document.createElement("div");
                completedMessage.innerText = "Module " + (i + 1) + " completed";
                document.querySelector("#ECTScript-control").appendChild(completedMessage);
                console.log("ECTScript: COMPLETED!\n    module " + (i + 1) + " completed!");
                continue;
            } else {
                if (i == 0) {
                    //allActivityNameLinks[0].click();
                } else if (i == 1) {
                    //allActivityNameLinks[2].click();
                } else if (i == 2) {
                    //allActivityNameLinks[5].click();
                } else if (i == 3) {
                    //allActivityNameLinks[7].click();
                } else if (i == 4) {
                    //allActivityNameLinks[8].click();
                }
            }
        }
    }

    function startModule() {
        if (!Boolean(localStorage.getItem("ECTScript-manually"))) {
            const startButton = document.querySelector("#n");
            startButton.click();
        }
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

    //attach the init() function to window so that it can be accessed globally (testing only)
    window.ECTScript = {
        init: init,
    }
})();