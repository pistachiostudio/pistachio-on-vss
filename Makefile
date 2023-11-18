clean:
	rm -rf ./vss_* ./vss

# for linux
setup: clean
	curl -OL https://github.com/vssio/go-vss/releases/latest/download/vss_linux_amd64.tar.gz
	tar -xvf vss_linux_amd64.tar.gz
	cp vss_linux_amd64/vss .

setup-win: clean
	curl -OL https://github.com/vssio/go-vss/releases/latest/download/vss_windows_amd64.zip
	unzip vss_windows_amd64.zip
	cp vss_windows_amd64/vss.exe .

build:
	./vss build