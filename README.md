# setup-CSC

This action sets up csc.exe as a CLI tool for use in actions by:
- optionally downloading and caching a version of VSWhere.exe to help find the latest CSC on the machine
- Adds the location of the CSC to the PATH


# Usage

Basic:
```yaml
steps:
name: ASP.NET CI
on: [push]
jobs:
  build:
    runs-on: windows-latest

    steps:
    - uses: actions/checkout@master

    - name: Setup csc.exe
      uses: yoavain/Setup-CSC@v4

    - name: CSC
      working-directory: src
      run: csc source.cs
```


# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!  See [Contributor's Guide](docs/contributors.md)