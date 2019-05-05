import _ from 'lodash/array'

export default {
  data() {
    return {
      imgs: {},
      imgDialog: false,
      privewImgScale: 1,
      privewImgIndex: 0,
      imgDom: null,
      imgDomBox: null,
      imgTopRange: {},
      imgLeftRange: {}
    }
  },
  watch: {
    privewImgIndex() {
      this.reset()
    },
    privewImgScale (value, oldValue) {
      this.$nextTick(() => {
        this.getTopAndLeftRange(value < oldValue)
      })
    }
  },
  computed: {
    prewImage () {
      return this.imgs[this.privewImgIndex] || {}
    }
  },
  methods: {
    addImage(image) {
      this.imgs = _.uniqBy([...this.imgs, image], 'url')
    },
    showImageDialog (src) {
      if (src.indexOf('http') > -1) {
        src = src.replace(/^.+(?=ymmfile)/, '')
      }
      this.imgDialog = true
      this.$nextTick(() => {
        this.privewImgIndex = this.imgs.findIndex(v => v.url.indexOf(src) > -1)
        this.imgDomBox = this.$refs.previewImgBox
        this.imgDom = this.$refs.previewImg
      })
    },
    prevImg() {
      if (this.privewImgIndex == 0) return
      this.privewImgIndex -= 1
    },
    nextImg() {
      if (this.privewImgIndex == this.imgs.length - 1) return
      this.privewImgIndex += 1
    },
    narrow() {
      if (this.privewImgScale <= 0.2 * 2) return
      this.privewImgScale -= 0.2
    },
    enlarge() {
      this.privewImgScale += 0.2
    },
    downloadImg() {
      // var alink = document.createElement("a");
      // alink.href = this.imgs[this.privewImgIndex].url
      // alink.download = ''
      // alink.click()

      // 把图片转成base64
      function getBase64Image(img) {
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, img.width, img.height);
        var ext = img.src.substring(img.src.lastIndexOf(".")+1).toLowerCase();
        var dataURL = canvas.toDataURL("image/"+ext);
        return dataURL;
      }

      let _url = this.imgs[this.privewImgIndex].url
      var image = new Image();
      image.crossOrigin = '';
      image.src = _url;
      image.onload = function(){
        var base64 = getBase64Image(image);
        const save_link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
        save_link.href = base64;
        save_link.download = 'image';

        const event = document.createEvent('MouseEvents');
        event.initMouseEvent('click', true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        save_link.dispatchEvent(event);
      }
    },
    closeImgDialog() {
      this.$nextTick(() => {
        this.reset()
      })
    },
    reset () {
      this.$nextTick(() => {
        this.privewImgScale = 1
        this.$refs.previewImg.style.left = '50%'
        this.$refs.previewImg.style.top = '50%'
      })
    },
    onload () {
      setTimeout(() => {
        this.getTopAndLeftRange()
      }, 300)
    },
    getTopAndLeftRange (narrow) {
      let { width: imgWidth, height: imgHeight } = this.imgDom.getBoundingClientRect()
      let { width: imgBoxWidth, height: imgBoxHeight } = this.imgDomBox.getBoundingClientRect()
      let left1 = imgWidth / 2
      let left2 = imgBoxWidth - imgWidth / 2
      let top1 = imgHeight / 2
      let top2 = imgBoxHeight - imgHeight / 2
      this.imgLeftRange = {
        iscover: imgWidth >= imgBoxWidth,
        min: Math.min(left1, left2),
        max: Math.max(left1, left2)
      }
      this.imgTopRange = {
        iscover: imgHeight >= imgBoxHeight,
        min: Math.min(top1, top2),
        max: Math.max(top1, top2)
      }
      this.movable(imgWidth >= imgBoxWidth || imgHeight >= imgBoxHeight)
      if (narrow) {
        // 缩小时保证图片还在可视范围
        let {offsetLeft, offsetTop} = this.imgDom
        this.setPositon(offsetLeft, offsetTop, offsetLeft, offsetTop)
      }
    },
    movable (canMove) {
      let imgDom = this.imgDom
      let startX = 0, startY = 0, imgLeft = 0, imgTop = 0
      let dragStart = e => {
        if (e.target != this.imgDom) return
        e.preventDefault()
        startX = e.clientX;
        startY = e.clientY;
        imgLeft = imgDom.offsetLeft
        imgTop = imgDom.offsetTop
        document.addEventListener('mousemove', dragmove)
        document.addEventListener('mouseup', dragend)
      }
      let dragmove = e => {
        e.preventDefault()
        let positionX = e.clientX - startX + imgLeft
        let positionY = e.clientY - startY + imgTop
        this.setPositon(positionX, positionY, imgLeft, imgTop)
      }
      let dragend = () => {
        document.removeEventListener('mousemove', dragmove)
        document.removeEventListener('mouseup', dragend)
      }
      if (canMove) {
        document.removeEventListener('mousedown', dragStart)
        setTimeout(() => {
          imgDom.style.cursor = 'move'
          document.addEventListener('mousedown', dragStart)
        }, 30)
      } else {
        imgDom.style.cursor = 'default'
        document.removeEventListener('mousedown', dragStart)
      }
    },
    /**
     * 设置移动后图片位置
     * @param {Number} positionX 移动后的图片left  缩小时此值和图片的offsetLeft 一样
     * @param {Number} positionY 移动后的图片top   缩小时此值和图片的offsetTop 一样
     * @param {Number} imgLeft 图片的offsetLeft
     * @param {Number} imgTop 图片的offsetTop
     */
    setPositon (positionX, positionY, imgLeft, imgTop) {
      let imgDom = this.imgDom
      let { iscover: lIscover, min: lMin, max: lMax } = this.imgLeftRange
      let { iscover: tIscover, min: tMin, max: tMax } = this.imgTopRange
      // 水平方向的移动
      if (lIscover) {
        if (positionX <= lMin) {
          positionX = lMin
        } else if (positionX >= lMax) {
          positionX = lMax
        }
      } else {
        positionX = imgLeft
      }
      // 垂直方向的移动
      if (tIscover) {
        if (positionY <= tMin) {
          positionY = tMin
        } else if (positionY >= tMax) {
          positionY = tMax
        }
      } else {
        positionY = imgTop
      }
      imgDom.style.left = positionX + 'px'
      imgDom.style.top = positionY + 'px'
    }
  }
}
