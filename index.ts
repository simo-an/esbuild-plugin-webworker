import esbuild, {
  BuildOptions,
  OnLoadArgs,
  OnLoadResult,
  OnResolveArgs,
  OnResolveResult,
  PluginBuild,
} from "esbuild";
import { dirname, basename, join } from "node:path";

const PLUGIN_NAME = "web-worker";
const PLUGIN_NAMESPACE = "WebWorker";

interface WebWorkerPluginOptions {
  inline: boolean;
  out: string;
  minify: boolean;
  filter: RegExp;
  keepImportName: boolean;
}

const defaultOptions: WebWorkerPluginOptions = {
  inline: true,
  out: "dist",
  minify: true,
  filter: /\?worker$/,
  keepImportName: false,
};

function webworker(options?: Partial<WebWorkerPluginOptions>) {
  const { inline, out, minify, filter, keepImportName } = {
    ...defaultOptions,
    ...options,
  };

  function onSetup(build: PluginBuild) {
    build.onResolve({ filter }, onBuildResolve);
    build.onLoad({ filter: /.*/, namespace: PLUGIN_NAMESPACE }, onBuildLoad);
  }

  function onBuildResolve(args: OnResolveArgs): OnResolveResult {
    return {
      path: keepImportName ? args.path : args.path.replace(filter, ""),
      namespace: PLUGIN_NAMESPACE,
      pluginData: { importer: args.importer },
    };
  }

  function createContents(data: string, inline: boolean) {
    return inline
      ? `
        function createWorker() {
          const blob = new Blob([\`${data}\`], { type: 'text/javascript' });
          setTimeout(() => URL.revokeObjectURL(blob), 0);
          
          return new Worker(URL.createObjectURL(blob));
        }
        export default createWorker;`
      : `
        function createWorker() {
          return new Worker(\`${data.replaceAll("\\", "/")}\`);
        }
        export default createWorker;`;
  }

  async function onBuildLoad(
    args: OnLoadArgs
  ): Promise<OnLoadResult | undefined> {
    const {
      path: importPath,
      pluginData: { importer },
    } = args;

    const entry = join(dirname(importer), importPath);

    try {
      const buildOptions: BuildOptions = {
        entryPoints: [entry],
        write: !inline,
        minify,
        bundle: true,
      };

      if (!inline) {
        const fileName = basename(entry);
        const outFileName = fileName.replace(/(\.ts)?$/, ".js");

        buildOptions.outfile = join(out, outFileName);
      }

      const result = await esbuild.build(buildOptions);

      let data: string | undefined;

      if (!inline && buildOptions.outfile) {
        data = buildOptions.outfile;
      }

      if (inline && result.outputFiles) {
        data = result.outputFiles[0].text;
      }

      if (!data) {
        throw new Error("no data");
      }

      return {
        contents: createContents(data, inline),
      };
    } catch (e) {
      console.error("Could not build worker script:", e);
    }
  }

  const WebWorkerPlugin = {
    name: PLUGIN_NAME,
    setup: onSetup,
  };

  return WebWorkerPlugin;
}

export default webworker;
