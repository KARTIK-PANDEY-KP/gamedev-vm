# Stand-in for a fresh cloud VM: Ubuntu 24.04, systemd as PID 1, nothing else
# installed (no curl, no gpg), so setup.sh has to bootstrap everything itself.
FROM --platform=linux/amd64 ubuntu:24.04
ENV container=docker
RUN apt-get update \
 && apt-get install -y --no-install-recommends systemd systemd-sysv dbus \
 && apt-get clean && rm -rf /var/lib/apt/lists/* \
 && systemctl mask systemd-logind.service getty.target console-getty.service \
      systemd-udevd.service systemd-udev-trigger.service systemd-firstboot.service \
 && rm -f /etc/machine-id
STOPSIGNAL SIGRTMIN+3
CMD ["/sbin/init"]
