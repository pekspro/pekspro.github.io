function copyTextToClipboard(text) {
    if (!navigator.clipboard) {
      console.error('Copy to clipboard not supported');
      return;
    }

    navigator.clipboard.writeText(text).then(function() {
      console.log('Async: Copying to clipboard was successful!');
    }, function(err) {
      console.error('Async: Could not copy text: ', err);
    });
  }
  
  function copyButtonClicked(clickEvent) {
      const text = clickEvent.srcElement.parentElement.parentElement.nextElementSibling.innerText;
  
      copyTextToClipboard(text);
  };
  
  window.onload = function(e){ 
      document.querySelectorAll('.copy-code-button').forEach((copyCodeButton) => {
          console.log("setup button...");
          copyCodeButton.addEventListener('click', copyButtonClicked);
      });
  }

  
