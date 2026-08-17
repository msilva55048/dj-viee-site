document.addEventListener("DOMContentLoaded", () => {

    const menuLinks = document.querySelectorAll(
        ".menu a[data-section]"
    );

    const sections = [];

    menuLinks.forEach((link) => {

        const sectionId = link.dataset.section;

        const section = document.getElementById(sectionId);

        if (section) {

            sections.push({
                id: sectionId,
                element: section,
                link: link
            });

        }

    });


    function removeActiveLinks() {

        menuLinks.forEach((link) => {

            link.classList.remove("active");

        });

    }


    function activateLink(sectionId) {

        removeActiveLinks();

        const activeLink = document.querySelector(
            `.menu a[data-section="${sectionId}"]`
        );

        if (activeLink) {

            activeLink.classList.add("active");

        }

    }


    function getNavbarHeight() {

        const navbar = document.querySelector(".navbar");

        if (!navbar) {

            return 0;

        }

        return navbar.offsetHeight;

    }


    function updateActiveSection() {

        const navbarHeight = getNavbarHeight();

        const referencePosition =
            window.scrollY
            + navbarHeight
            + 90;

        let activeSection = null;


        sections.forEach((section) => {

            const sectionTop =
                section.element.offsetTop;

            if (referencePosition >= sectionTop) {

                activeSection = section.id;

            }

        });


        const nearBottom =
            window.innerHeight
            + window.scrollY
            >= document.documentElement.scrollHeight - 20;


        if (nearBottom) {

            activeSection = "contato";

        }


        if (activeSection) {

            activateLink(activeSection);

        } else {

            removeActiveLinks();

        }

    }


    menuLinks.forEach((link) => {

        link.addEventListener(
            "click",
            (event) => {

                const sectionId =
                    link.dataset.section;

                const section =
                    document.getElementById(sectionId);


                if (!section) {

                    return;

                }


                event.preventDefault();


                const navbarHeight =
                    getNavbarHeight();


                const destination =
                    section.getBoundingClientRect().top
                    + window.scrollY
                    - navbarHeight
                    - 18;


                window.scrollTo({

                    top: destination,

                    behavior: "smooth"

                });


                activateLink(sectionId);

            }
        );

    });


    const internalButtons =
        document.querySelectorAll(
            'a[href="#sobre"],' +
            'a[href="#musicas"],' +
            'a[href="#agenda"],' +
            'a[href="#contato"]'
        );


    internalButtons.forEach((button) => {

        if (button.closest(".menu")) {

            return;

        }


        button.addEventListener(
            "click",
            (event) => {

                const href =
                    button.getAttribute("href");


                if (!href || !href.startsWith("#")) {

                    return;

                }


                const target =
                    document.querySelector(href);


                if (!target) {

                    return;

                }


                event.preventDefault();


                const navbarHeight =
                    getNavbarHeight();


                const destination =
                    target.getBoundingClientRect().top
                    + window.scrollY
                    - navbarHeight
                    - 18;


                window.scrollTo({

                    top: destination,

                    behavior: "smooth"

                });

            }
        );

    });


    window.addEventListener(
        "scroll",
        updateActiveSection,
        {
            passive: true
        }
    );


    window.addEventListener(
        "resize",
        updateActiveSection
    );


    updateActiveSection();

});