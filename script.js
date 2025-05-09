$(document).ready(() => {
  $(window).scroll(function () {
    if ($(this).scrollTop() > 50) {
      $(".navbar").addClass("scrolled").addClass("shadow-sm")
    } else {
      $(".navbar").removeClass("scrolled").removeClass("shadow-sm")
    }
  })

  $.ajax({
    url: "http://numbersapi.com/1/30/date?json",
    type: "GET",
    dataType: "json",
    success: (data) => {
      $("#fact-text")
        .hide()
        .html("On this day in history: " + data.text)
        .fadeIn(800)
      $(".fact-icon").addClass("fact-icon-spin")
    },
    error: () => {
      $("#fact-text").html(
        "Failed to load today's fact. Please try again later."
      )
    },
  })

  const animateOnScrollObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("animate-in")

          if (
            entry.target.classList.contains("feature-card") ||
            entry.target.classList.contains("program-card")
          ) {
            const delay = Math.random() * 0.3
            entry.target.style.transitionDelay = `${delay}s`
          }

          animateOnScrollObserver.unobserve(entry.target)
        }
      })
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -50px 0px",
    }
  )

  document
    .querySelectorAll(
      ".feature-card, .program-card, .testimonial-item, .animate-on-scroll"
    )
    .forEach((element) => {
      animateOnScrollObserver.observe(element)
    })

  function animateHeroText() {
    const heroElements = document.querySelectorAll(
      ".hero-text h1, .hero-text p, .hero-text div"
    )
    heroElements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add("text-visible")
      }, 300 * index)
    })
  }

  setTimeout(animateHeroText, 200)

  const uploadContainer = $("#upload-container")
  const fileInput = $("#file-input")
  const uploadProgress = $("#upload-progress")
  const progressBar = uploadProgress.find(".progress-bar")
  const uploadPreview = $("#upload-preview")

  uploadContainer
    .on("mouseenter", function () {
      $(this).addClass("upload-hover")
    })
    .on("mouseleave", function () {
      if (!$(this).hasClass("dragover")) {
        $(this).removeClass("upload-hover")
      }
    })

  uploadContainer.on("click", () => {
    fileInput.click()
  })

  fileInput.on("change", (e) => {
    handleFiles(e.target.files)
  })

  uploadContainer.on("dragover", function (e) {
    e.preventDefault()
    e.stopPropagation()
    $(this).addClass("dragover").addClass("upload-hover")
  })

  uploadContainer.on("dragleave", function (e) {
    e.preventDefault()
    e.stopPropagation()
    $(this).removeClass("dragover").removeClass("upload-hover")
  })

  uploadContainer.on("drop", function (e) {
    e.preventDefault()
    e.stopPropagation()
    $(this).removeClass("dragover").removeClass("upload-hover")
    $(this).addClass("upload-success")

    setTimeout(() => {
      $(this).removeClass("upload-success")
    }, 1500)

    if (e.originalEvent.dataTransfer && e.originalEvent.dataTransfer.files) {
      handleFiles(e.originalEvent.dataTransfer.files)
    }
  })

  function handleFiles(files) {
    if (files.length === 0) return

    const totalFiles = files.length
    let filesProcessed = 0

    uploadProgress.fadeIn(300).removeClass("d-none")
    progressBar.css("width", "0%").attr("aria-valuenow", 0)

    if (uploadPreview.children().length === 0) {
      uploadPreview.empty()
    }

    for (let i = 0; i < files.length; i++) {
      if (!files[i].type.match("image.*")) {
        showToast("Only image files are allowed", "error")
        continue
      }

      const file = files[i]
      uploadFile(file, i)
      displayPreview(file, i)
    }

    function uploadFile(file, index) {
      const formData = new FormData()
      formData.append("images", file)

      let progress = 0
      const interval = setInterval(() => {
        progress += 5
        let totalProgress = Math.floor(
          (filesProcessed / totalFiles) * 100 + progress / totalFiles
        )

        if (totalProgress > 100) totalProgress = 100

        progressBar
          .css("width", totalProgress + "%")
          .attr("aria-valuenow", totalProgress)
          .text(totalProgress + "%")

        if (progress >= 100) {
          clearInterval(interval)
          filesProcessed++

          if (filesProcessed === totalFiles) {
            progressBar.addClass("progress-complete")
            setTimeout(() => {
              uploadProgress.fadeOut(500, function () {
                $(this).addClass("d-none")
                progressBar.removeClass("progress-complete")
              })
              showToast("Upload complete!", "success")
            }, 1000)
          }
        }
      }, 100)

      $.ajax({
        url: "/upload",
        type: "POST",
        data: formData,
        processData: false,
        contentType: false,
        xhr: () => {
          const xhr = new XMLHttpRequest()
          xhr.upload.addEventListener(
            "progress",
            (e) => {
              if (e.lengthComputable) {
                const percent = Math.round((e.loaded / e.total) * 100)
                progressBar
                  .css("width", percent + "%")
                  .attr("aria-valuenow", percent)
                  .text(percent + "%")
              }
            },
            false
          )
          return xhr
        },
        success: (response) => {
          console.log("Upload successful", response)
        },
        error: (xhr, status, error) => {
          console.error("Upload failed", error)
          showToast("Upload failed. Please try again.", "error")
        },
      })
    }

    function displayPreview(file, index) {
      const reader = new FileReader()

      reader.onload = (e) => {
        const previewItem = $(`
          <div class="col-6 col-md-4 col-lg-3 upload-preview-item">
            <div class="card border-0 shadow-sm">
              <div class="preview-image-container">
                <img src="${e.target.result}" alt="Uploaded image" class="card-img-top">
                <div class="preview-overlay">
                  <div class="upload-remove" data-index="${index}">
                    <i class="fas fa-times"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `)

        uploadPreview.append(previewItem)

        previewItem.find(".upload-remove").on("click", (e) => {
          e.stopPropagation()
          previewItem.addClass("removing")
          setTimeout(() => {
            previewItem.fadeOut(300, function () {
              $(this).remove()
            })
          }, 300)
        })

        setTimeout(() => {
          previewItem.addClass("preview-visible")
        }, index * 100)
      }

      reader.readAsDataURL(file)
    }
  }

  function showToast(message, type = "info") {
    $(".toast-notification").remove()

    const toast = $(`
      <div class="toast-notification toast-${type}">
        <div class="toast-icon">
          <i class="fas ${
            type === "success" ? "fa-check-circle" : "fa-exclamation-circle"
          }"></i>
        </div>
        <div class="toast-message">${message}</div>
      </div>
    `)

    $("body").append(toast)

    setTimeout(() => {
      toast.addClass("show-toast")

      setTimeout(() => {
        toast.removeClass("show-toast")
        setTimeout(() => {
          toast.remove()
        }, 500)
      }, 3000)
    }, 100)
  }

  function enhancedTestimonials() {
    const testimonials = $(".testimonial-item")
    let currentIndex = 0
    let nextIndex = 0

    function showNextTestimonial() {
      nextIndex = (currentIndex + 1) % testimonials.length

      $(testimonials[currentIndex])
        .removeClass("active-testimonial")
        .addClass("exit-left")

      $(testimonials[nextIndex])
        .addClass("active-testimonial")
        .addClass("enter-right")

      setTimeout(() => {
        $(testimonials[currentIndex]).removeClass("exit-left")
        $(testimonials[nextIndex]).removeClass("enter-right")
        currentIndex = nextIndex
      }, 600)
    }

    $(testimonials[0]).addClass("active-testimonial")

    setInterval(showNextTestimonial, 5000)
  }

  enhancedTestimonials()

  $(window).scroll(function () {
    const scrollPosition = $(this).scrollTop()

    $(".hero-image").css({
      transform: `translateY(${scrollPosition * 0.2}px)`,
    })

    $("#cta").css({
      backgroundPositionY: `${-scrollPosition * 0.05}px`,
    })
  })

  $(".feature-card, .program-card").hover(
    function () {
      $(this).addClass("card-hover")
    },
    function () {
      $(this).removeClass("card-hover")
    }
  )

  function animateCounters() {
    $(".counter").each(function () {
      const $this = $(this)
      const countTo = parseInt($this.attr("data-count"))

      $({ countNum: 0 }).animate(
        {
          countNum: countTo,
        },
        {
          duration: 2000,
          easing: "swing",
          step: function () {
            $this.text(Math.floor(this.countNum))
          },
          complete: function () {
            $this.text(this.countNum)
          },
        }
      )
    })
  }

  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animateCounters()
        counterObserver.unobserve(entry.target)
      }
    })
  })

  const counterSection = document.querySelector("#stats")
  if (counterSection) {
    counterObserver.observe(counterSection)
  }

  function animateCTAButtons() {
    $(".pulse-btn").addClass("pulse")

    setTimeout(() => {
      $(".pulse-btn").removeClass("pulse")

      setTimeout(animateCTAButtons, 10000)
    }, 2000)
  }

  setTimeout(animateCTAButtons, 3000)
})
