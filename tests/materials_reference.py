def axial(force_n, area_mm2, length_mm, E_mpa, yield_mpa, safety=1):
    stress=force_n/area_mm2
    strain=stress/E_mpa
    return stress,strain,strain*length_mm,yield_mpa/safety
if __name__=='__main__': print(axial(10000,100,1000,200000,250,2))
