
# setup-MSBuild

This action sets up MSBuild.exe as a CLI tool for use in actions by:
- optionally downloading and caching a version of VSWhere.exe to help find the latest MSBuild on the machine
- Adds the location of the MSBuild to the PATH


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

    - name: Setup MSBuild.exe
      uses: warrenbuckley/Setup-MSBuild@v1

    - name: MSBuild
      working-directory: src
      run: msbuild MyProject.csproj
```


# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Contributions

Contributions are welcome!  See [Contributor's Guide](docs/contributors.md)