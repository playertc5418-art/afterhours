(function () {
  'use strict';

  self.addEventListener("message", async (event) => {
    try {
      const maps = await Promise.all(["atelier", "gallery"].map(async (name) => {
        const response = await fetch(event.data.base + name + ".bin.gz");
        if (!response.ok) throw new Error(name + " environment " + response.status);
        const packed = await response.arrayBuffer(), magic = new Uint8Array(packed, 0, 2);
        const data = magic[0] === 31 && magic[1] === 139 ? await new Response(new Blob([packed]).stream().pipeThrough(new DecompressionStream("gzip"))).arrayBuffer() : packed;
        const header = new Uint32Array(data, 0, 2);
        const [width, height] = header;
        if (width !== 768 || height !== 1024 || data.byteLength !== 8 + width * height * 8) throw new Error("Invalid baked environment");
        return { name, width, height, data: data.slice(8) };
      }));
      self.postMessage({ maps }, { transfer: maps.map((map) => map.data) });
    } catch (error) {
      self.postMessage({ error: String(error) });
    }
  });

})();
