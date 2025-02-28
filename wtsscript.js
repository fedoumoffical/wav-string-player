document.getElementById("wavFile").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const arrayBuffer = e.target.result;
            const uint8Array = new Uint8Array(arrayBuffer);
            const binaryString = String.fromCharCode.apply(null, uint8Array);
            const base64String = btoa(binaryString);
            document.getElementById("wavString").value = base64String;
        };
        reader.readAsArrayBuffer(file);
    }
});

document.getElementById("copyButton").addEventListener("click", function() {
    const wavString = document.getElementById("wavString");
    wavString.select();
    document.execCommand("copy");
});