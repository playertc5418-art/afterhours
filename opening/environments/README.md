# 固定环境图

atelier.bin.gz / gallery.bin.gz 来自接入快照的实际运行环境：Atelier 程序环境与 Three.js RoomEnvironment，经原 PMREM 参数处理，读取 RGBA HalfFloat CubeUV 结果导出。保留 Three.js 的 MIT 许可；没有使用参考网站的视觉素材。

每个文件解压：UInt32 宽、高（768 / 1024），随后 RGBA Uint16 半浮点像素，共 8 + 768×1024×8 字节。运行时按 CubeUVReflectionMapping、LinearSRGBColorSpace、LinearFilter 载入，不生成 mipmaps。

用途：把固定环境生成提前完成，避免每次开场在 GPU 上重新做 PMREM。两个压缩文件合计 1,303,688 字节。Worker 检查 gzip 魔数，可处理服务器已经设置 Content-Encoding 解压过的响应。

边界：这些是 2026-10-27 场景环境的固定结果。以后若改变生成环境的灯光/颜色/物件，需重新导出对应结果，或使用原生成路径；不能仅替换场景后继续宣称二者一致。
