document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById("comment-form");
    if (!form) return;

    const postId = form.dataset.postId;
    const list = document.querySelector(".comment-list");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const contentInput = document.getElementById("comment-content");
        const content = contentInput.value.trim();

        if (!content) {
            alert("Please fill in comment field to post comment.");
            return;
        }

        try {
            const response = await fetch(`/post/${postId}/comments`, {
                method: "POST", headers: {"Content-Type": "application/json",}, body: JSON.stringify({content})
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(data.error || "Problem saving comment.");
            }

            const li = document.createElement("li");
            li.className = "comment-item";
            li.innerHTML = `
                <p><strong>${data.author}</strong> - ${data.created_at}</p>
                <p>${content}</p>
                <form method="POST" action="/admin/comments/${data.id}/delete">
                    <input type="hidden" name="postId" value="${postId}">
                    <button class="btn btn-delete" type="submit">Delete</button>
                </form>
                `;

            list.appendChild(li);
            contentInput.value = "";
        }
        catch (err) {
            console.error(err);
            alert("Sorry, there was a problem saving your comment.");
        }
    });
});