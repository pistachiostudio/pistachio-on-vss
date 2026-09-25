clean:
	rm -rf ./vss_* ./vss

# for linux (this is what CI uses)
setup: clean
	curl -OL https://github.com/veltiosoft/vss/releases/latest/download/vss_linux_amd64.tar.gz
	tar -xvf vss_linux_amd64.tar.gz

setup-win: clean
	curl -OL https://github.com/veltiosoft/vss/releases/latest/download/vss_windows_amd64.zip
	unzip vss_windows_amd64.zip

# for local dev on Apple Silicon Macs
setup-mac: clean
	curl -OL https://github.com/veltiosoft/vss/releases/latest/download/vss_darwin_arm64.tar.gz
	tar -xvf vss_darwin_arm64.tar.gz

build:
	./vss build
