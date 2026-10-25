# VSS のバージョンは固定する(latest だと破壊的変更がそのまま本番に入るため)
# 上げるときは VSS_VERSION と VSS_SHA256_* を一緒に更新する
# (ハッシュは gh api repos/veltiosoft/vss/releases/tags/<版> -q '.assets[] | "\(.name) \(.digest)"' で見られる)
VSS_VERSION ?= v0.21.0
VSS_RELEASE_URL = https://github.com/veltiosoft/vss/releases/download/$(VSS_VERSION)
VSS_SHA256_LINUX_AMD64 ?= a6bd846ff122c85e6284cc3756d8242d51df88beb3d4cac5f8985638839c0f77
VSS_SHA256_DARWIN_ARM64 ?= 52a24f386318de3ff4c91696bf4e113ffc3d6afda04b307f558694782ce42024
VSS_SHA256_WINDOWS_AMD64 ?= 63022ea4c81d1178cb6466b42630329dd1814c052bec464f8b8b304b51cc59de

clean:
	rm -rf ./vss_* ./vss

# for linux (this is what CI uses)
setup: clean
	curl -fsSLO $(VSS_RELEASE_URL)/vss_linux_amd64.tar.gz
	echo "$(VSS_SHA256_LINUX_AMD64)  vss_linux_amd64.tar.gz" | sha256sum -c -
	tar -xvf vss_linux_amd64.tar.gz
	chmod +x vss

setup-win: clean
	curl -fsSLO $(VSS_RELEASE_URL)/vss_windows_amd64.zip
	echo "$(VSS_SHA256_WINDOWS_AMD64)  vss_windows_amd64.zip" | sha256sum -c -
	unzip -o vss_windows_amd64.zip

# for local dev on Apple Silicon Macs
setup-mac: clean
	curl -fsSLO $(VSS_RELEASE_URL)/vss_darwin_arm64.tar.gz
	echo "$(VSS_SHA256_DARWIN_ARM64)  vss_darwin_arm64.tar.gz" | shasum -a 256 -c -
	tar -xvf vss_darwin_arm64.tar.gz
	chmod +x vss

build:
	./vss build
