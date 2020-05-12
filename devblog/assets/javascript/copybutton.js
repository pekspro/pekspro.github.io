function copyTextToClipboard(text, elementsToBeTransparent) {
    if (!navigator.clipboard) {
      console.error('Copy to clipboard not supported');
      return;
    }

    navigator.clipboard.writeText(text).then(function() {
      for(i = 0; i < elementsToBeTransparent.length; i++) {
        var a = elementsToBeTransparent[i];
        a.classList.remove("is-transparent");

        setTimeout(function()
        {
          a.classList.add("is-transparent");
        }, 1500);
      }

    }, function(err) {
      console.error('Async: Could not copy text: ', err);
    });
  }

  function copyButtonClicked(clickEvent) {
      const text = clickEvent.srcElement.parentElement.nextElementSibling.innerText;
  
      copyTextToClipboard(text, clickEvent.srcElement.getElementsByClassName("is-transparent"));
  };
  
  window.onload = function(e){ 
      document.querySelectorAll('.copy-code-button').forEach((copyCodeButton) => {
          console.log("setup button...");
          copyCodeButton.addEventListener('click', copyButtonClicked);
      });
  }

  
